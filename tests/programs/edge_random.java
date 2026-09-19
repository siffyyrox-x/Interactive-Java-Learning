import java.util.Random;
public class Main {
  public static void main(String[] args) {
    Random r = new Random(7);
    for (int i = 0; i < 5; i++) System.out.print(r.nextInt(100) + " ");
    System.out.println();
    Random r2 = new Random(12345L);
    System.out.println(r2.nextInt(6) + " " + r2.nextInt(16) + " " + r2.nextInt() + " " + r2.nextBoolean());
    System.out.println(r2.nextDouble());
  }
}
